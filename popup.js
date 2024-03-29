chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
  var currentUrl = tabs[0].url;
  const form = document.getElementById('review-form');
  const submitButton = document.getElementById('submit-button');
  submitButton.disabled = true;
  form.addEventListener('input', () => {
    submitButton.disabled = document.getElementById('review-text').value.trim() === '';
  });

  form.addEventListener('submit', async (event) => {

    event.preventDefault();


    const inputReview = document.getElementById('review-text').value;
    // const inputReviewPageLink = document.getElementById('review-link-text').value;


    try {
      submitButton.disabled = true;

      const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ textReview: inputReview, url: currentUrl }),
      });


      if (response.ok) {
        const data = await response.json();
        const prediction = data.prediction;
        const similarityPercentage = data.percentage
        const summarizedReview = data.summarizedReview;
        const comparison = data.comparison;

        const reviewResultDiv = document.getElementById('prediction-result');
        const reviewSimilarity = document.getElementById('similarity-percentage');
        const reviewSummarizedtDiv = document.getElementById('summarized-review');
        const reviewSummaryResultDiv = document.getElementById('prediction-summary');

        reviewResultDiv.innerText = prediction === 0 ? 'This is a Genuine Review' : 'This Review contains Disinformation';
        reviewSimilarity.innerText = similarityPercentage ? `${similarityPercentage}% Similar to Overall Feedbacks` : 'Something went wrong';
        reviewSummarizedtDiv.innerText = summarizedReview ? summarizedReview : 'Something went wrong';
        reviewSummaryResultDiv.innerText = comparison ? comparison : 'Something went wrong';
      } else {
        console.error('Request failed:', response.status);
      }
    } catch (error) {
      console.error('Request failed:', error);
    }
    finally {
      submitButton.disabled = false;
    }
  });
});